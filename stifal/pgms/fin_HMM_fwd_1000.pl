#!/usr/bin/perl

open SEQ,"$ARGV[0]" || die "Type 'perl position.pl x.seq x.con' \n";
@query_seq_file=<SEQ>;
close SEQ;

undef %seq;
foreach (@query_seq_file)
{
        if($_ =~ /^>/)
        {
		#print "KKKKKKKKK $1\n";
		$key = $_;
		$tmp=();
        }
        else
        {
                chomp($_);
                $tmp=$tmp.$_;
		$seq{$key} = $tmp;
        }
}

open FILE,"$ARGV[1]" || die "could not open the file\n";
@consfile =<FILE>;
close FILE;

undef %cons;
foreach(@consfile)
{
        chomp($_);
        if($_ =~ /^FACTOR=(\w+)/)
        {
		push(@comm,$_);
		$keycon = $1;
		$tmpseq = ();
        }
        else
        {
		chomp ($_);
                $tmpseq = $tmpseq . $_;
                $tmpseq=$tmpseq.'-';
		$cons{$keycon} = $tmpseq;
        }
}

sub scores
{
	my ($ss) =@_;
	@spseq=split(//,$ss);

	for(my $k=0;$k<$row;$k++)
	{
                if($ss eq $filecc[$k])
                {       
		for(my $j=0;$j<$lencol;$j++)
		{
			for(my $i=0;$i<$row;$i++)
			{
				if($i!=$k)
				{
					if( $mat[$i][$j] eq 'A')
					{
						$a++;
						$jfreqa=($a/($row-1))+1;	#pseducount
						sub qu_check
						{
						        my($a,$b,$c) = @_;
						        if ($a eq $b)
							{
						                $q_freq=$c;
						                return $q_freq;
						        }
							else
							{
						                $q_freq=1;
						                return $q_freq;
						        }
						}
						$jff=qu_check($spseq[$j],$mat[$i][$j],$jfreqa);
					}
					elsif($mat[$i][$j] eq 'C')
					{
						$c++;
						$jfreqc=($c/($row-1))+1;
						$jff =qu_check($spseq[$j],$mat[$i][$j],$jfreqc);
					}
					elsif($mat[$i][$j] eq 'G')
					{
						$g++;
			                	$jfreqg=($g/($row-1))+1;
						$jff=qu_check($spseq[$j],$mat[$i][$j],$jfreqg);
					}
					elsif($mat[$i][$j] eq 'T')
					{
						$t++;
			                	$jfreqt=($t/($row-1))+1;
						$jff=qu_check($spseq[$j],$mat[$i][$j],$jfreqt);
		                        }
					push(@jqq_freq,$jff);
				}
				else
				{
					next;
				}
			}
			#print "ininiininiinini :: @jqq_freq\n";
               		@jobs_freq= sort {$b <=> $a} @jqq_freq;
	                push(@jobs_prob_no,$jobs_freq[0]);
        	        if($spseq[$j] eq 'A' || $spseq[$j] eq 'T')
                	{
                        	$jq_at++;
	                }
        	        elsif($spseq[$j] eq 'G' || $spseq[$j] eq 'C')
                	{
                        	$jq_gc++;
	                }

			$a=$c=$g=$t=0;
			$jfreqa=$freqc=$freqg=$jfreqt=();
			@jqq_freq=();
		}
		$incr=1;
	        foreach(@jobs_prob_no)
	        {
        		$incr*=$_;
	        }
        	$jq_apriori = $jq_at*(log (0.375)) + $jq_gc *(log (0.125));
	        $jq_score=log($incr) - $jq_apriori;
		$normal = $jq_score/$lencol; 	
#		print "LLLLLLLLLLLLLLLL :: $threshold\n";

                        push (@valid_score,$normal);
                }       

		$incr=1;
     		$jq_apriori=$jq_score=$jq_at=$jq_gc=0;
		@jobs_prob_no=();
	}
}
foreach(@comm)
{
	@spcom=split(/\t+/,$_);
        foreach($spcom[2])
        {
                @spthre=split(/=/,$_);
                push(@threshold,$spthre[1]);
        }
}

	for $key (sort keys %seq)
	{	
		print "$key";
		#print "SEQQ :: $key :::::::::::::::: $seq{$key}\n";
		chomp($seq{$key});
		@splqu_seq=split(//,$seq{$key});
                $len=length($seq{$key});
		#print "LLLLLLLLLLLLLLLLLLLLLLLLLLLL$key\n";
		@kspl = split(/\s/,$key);
		#print "))))))))) $kspl[2]\n";	
		@kagain = split(/-|:/,$kspl[2]);
		#print "FINFINFN :: $kagain[1]\n";
#undef %pos;
for $keycon (sort keys %cons)
{
        print "****$keycon\n";
	@filecc=split(/-|\*/,$cons{$keycon});
	foreach(@filecc)
        {
                $wini=length($_);
        }
	print "LEN :: $wini\n";
	$no_st = -1001;$back_no_st = -1001;
		for(my $t=0;$t<=$len-$wini;$t++)
			{	                        
	#		print "TTT :: $t :::: $len-$wini\n";
                                for (my $q=$t;$q<$t+$wini;$q++)
                                {
                                        $string.=$splqu_seq[$q];
                                }

				#print "LLLLLL$kagain[1]\n";
#				print "STRING ::: $string\n";
				$ff++;
                                $st = ($ff - 1) + $kagain[1];
                                $xx = ($st+$wini) - 1;
#                               print "KKKK :: $st \t $xx \n";

				$no_st++;
                                $start = $no_st;
                                $end = ($start+$wini) - 1;

                                if($ff > 1000)
                                {
                                        $UTR = "___5UTR";
                                }
#                               print "UUUUUUUUUU :: $UTR\n";

                                $back_ff++;
#                               print "BACKKKKKKKK :: $back_ff\n";
                                $back_st = ($back_ff-1)+$kagain[1];
                                $back_xx = ($back_st-$wini) + 1;
				
				$back_no_st++;
                                $back_start = $back_no_st;
                                $back_end = ($back_start+$wini) - 1;

				if($back_ff > 1000)
                                {
                                        $back_UTR = "___5UTR";
                                }
				
				if($ff < 1000 || $back_ff < 1000)
                                {
                                push(@winslid_seq_pos,"*"."$string"."="."$st"."-"."$xx"."="."$start"."to"."$end");
                                $jo = join("",@winslid_seq_pos);

                                $string_rev=reverse $string;
                                push(@winslid_seq_rev_pos,"*".$string_rev."="."$back_st"."-"."$back_xx"."="."$back_start"."to"."$back_end");
                                $jo_rev = join("",@winslid_seq_rev_pos);
=d
                                $string =~tr/aAcCgGtT/tTgGcCaA/;
                                push(@winslid_seq_com_pos,"*"."$string"."="."$back_st"."-"."$back_xx");
                                $jo_com = join("",@winslid_seq_com_pos);

                                $string_comrev=reverse $string;
                                push(@winslid_seq_comrev_pos,"*"."$string_comrev"."="."$st"."-"."$xx");
                                $jo_comrev = join("",@winslid_seq_comrev_pos);
=cut
                                }	
				elsif($ff > 1000 || $back_ff > 1000)
				{
                                push(@winslid_seq_pos,"*"."$string"."="."$st"."-"."$xx$UTR"."="."$start"."to"."$end");
				$jo = join("",@winslid_seq_pos);

                                $string_rev=reverse $string;
 
                                push(@winslid_seq_rev_pos,"*".$string_rev."="."$back_st"."-"."$back_xx$back_UTR"."="."$back_start"."to"."$back_end");
				$jo_rev = join("",@winslid_seq_rev_pos); 
=d
                                $string =~tr/aAcCgGtT/tTgGcCaA/;
                                push(@winslid_seq_com_pos,"*"."$string"."="."$back_st"."-"."$back_xx$back_UTR");
				$jo_com = join("",@winslid_seq_com_pos);
 
                                $string_comrev=reverse $string;
                                push(@winslid_seq_comrev_pos,"*"."$string_comrev"."="."$st"."-"."$xx$UTR");
				$jo_comrev = join("",@winslid_seq_comrev_pos);
=cut
				}
                                $string=();
                        }
		$xx = $ff = $back_ff= $back_xx = $UTR = $back_UTR =();
=d
                        print "****@winslid_seq\n";
                        print "******@winslid_seq_rev\n";
                        print "*******@winslid_seq_com\n";
                        print "********@winslid_seq_comrev\n";
print "***$jo\n";
print "*****$jo_rev\n";
print "******$jo_com\n";
print "********$jo_comrev\n";
=cut
		

@spl = split(/\*/,$jo);
@spl_rev = split(/\*/,$jo_rev);
@spl_com = split(/\*/,$jo_com);
@spl_comrev = split(/\*/,$jo_comrev);


#print "SPLI :: @spl\n";
for($zz=0;$zz<=$#spl;$zz++)
{
	@winslid_seq = split(/=/,$spl[$zz]);
	@winslid_seq_rev = split(/=/,$spl_rev[$zz]);
	@winslid_seq_com = split(/=/,$spl_com[$zz]);
	@winslid_seq_comrev = split(/=/,$spl_comrev[$zz]);
	#print "JJJJJJJJJJJJJJJJJJJJJJJJ $winslid_seq[0]\n";	
if ($winslid_seq[0] ne "" || $winslid_seq_rev[0] ne "" || $winslid_seq_com[0] ne "" || $winslid_seq_comrev[0] ne "")
{
		for($v=0;$v<=$winslid_seq[0];$v++)
		{
#			print "LLLLLLLLLLLL  :: $winslid_seq[0] ::: $winslid_seq[1]\n";
			#print "LLLLLLLLLLLL  :: $winslid_seq_rev[0] ::: $winslid_seq_rev[1]\n";
			#print "LLLLLLLLLLLL  :: $winslid_seq_com[0] ::: $winslid_seq_com[1]\n";
			#print "LLLLLLLLLLLL  :: $winslid_seq_comrev[0] ::: $winslid_seq_comrev[1]\n";
			for($d=0;$d<=$#filecc;$d++)
        		{
                	      if(length($filecc[$d]) eq $wini && length($winslid_seq[0]) eq $wini)
                        	{
                        		chomp ($filecc[$d]);
        #                       	print "WWWWWWWWWWW :: $filecc[$d]\n";
	                                @temp=split(//,$filecc[$d]);
        	                        $lencol=length($filecc[$d]);
                	                for(my $j=0;$j<$lencol;$j++)
                        	        {
                                		$mat[$row][$j]=$temp[$j];
	                                }
        	                        $row++;
                	         }
	                } 
			#print "****iIIII :: $winslid_seq[$v]\n";
			scores($winslid_seq[0]);
			@validmax = sort {$b <=> $a} @valid_score;
       	                if($valid_score[0] != 0)
                        {
                                print "FORWARD\t\t$winslid_seq[0]\t\t$winslid_seq[1]\t\t$winslid_seq[2]\t\t";
                                printf "%.4f",$validmax[0];
                                print "\n";
                        }
                        @valid_score=@pred_score=();

			scores($winslid_seq_rev[0]);
                        @validmax_rev = sort {$b <=> $a} @valid_score;
                        if($valid_score[0] != 0)
                        {
                                print "REVERSE\t\t$winslid_seq_rev[0]\t\t$winslid_seq_rev[1]\t\t$winslid_seq[2]\t\t";
                                printf "%.4f",$validmax_rev[0];
                                print "\n";
                        }
                        @valid_score=@pred_score=();
=d
			scores($winslid_seq_com[0]);
                        @validmax_com = sort {$b <=> $a} @valid_score;
                        if($valid_score[0] != 0)
                        {
                                print "FORWARD   - \t$winslid_seq_com[0]\t$winslid_seq_com[1]\t\t";
                                printf "%.4f",$validmax_com[0];
                                print"\t\t\t 'VALIDATED'\n";
                        }
                        @valid_score=@pred_score=();
			
			scores($winslid_seq_comrev[0]);
                        @validmax_comrev = sort {$b <=> $a} @valid_score;
                        if($valid_score[0] != 0)
                        {
                                print "REVERSE   - \t$winslid_seq_comrev[0]\t$winslid_seq_comrev[1]\t\t";
                                printf "%.4f",$validmax_comrev[0];
                                print"\t\t\t 'VALIDATED'\n";
                        }
                        @valid_score=@pred_score=();
=cut
			$row=0;
}
		@winslid_seq_pos=@winslid_seq_rev_pos=@winslid_seq_com_pos=@winslid_seq_comrev_pos=();
		@winslid_seq=@winslid_seq_rev=@winslid_seq_com=@winslid_seq_comrev=();
}
		}	
		$xx = $ff = $back_ff= $back_xx = $UTR = $back_UTR = 0;
		undef %pos;
	}
		print "************************ END OF FILE*********8 \n\n";
}	

