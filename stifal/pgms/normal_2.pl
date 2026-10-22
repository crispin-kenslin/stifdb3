open FILE,"$ARGV[0]" || die "Type 'perl normal_2.pl normalisation_output'\n";
@file= <FILE>;
close (FILE);

foreach(@file)
{
        chomp ($_);
        if($_ =~/^\*\*\*\*(\w+)/)
        {
                $kk = $1;
		push(@DE_NU,$1);
        }
        elsif($_ =~ /^>/ || $_ =~/^Z-SCORE/ || $_ =~ /^ PAR/ || $_ =~ /^ENTIRE/	|| $_ =~ /^TOTAL/ || $_ =~ /^SINGLE/)
        {
                $full{$kk} .= $_ ;
                $full{$kk} .= "[[[";
		if($_ =~ /^SINGLE/ || $_ =~ /^ENTIRE/ )
		{
	#		print "~~~~~~~~$_\n";
			if($_ =~ /^SINGLE/)
			{ 
				@sppp = split(/::/,$_);
				push(@DE_NU,"-".$sppp[1]."LLL");
			}
			else
			{
				@spentire = split(/::/,$_);
				$entire = $spentire[1];
		#		push(@DE_NU,"[[".$spentire[1]); 
			}
		}	
		 if($_ =~ /^TOTAL/)
		{
#			print "TOTOT$_\n";
			@TO = split(/::/,$_);
#			print "$TO[1]=$TO[2]\n";
			push(@NU_DE,$TO[1]."=".$TO[2]."*");
		} 
        }
}
#print "NU __ DE :: @NU_DE\n";
$jonu_de = join("",@NU_DE);
#print "NU _ DE $jonu_de\n";	
@spcalcal = split(/\*/,$jonu_de);
=d
#foreach(@spcalcal)
{
	#print "(((((($_\n";
	@sp1 = split (/=/,$_);
	#print "LLLLLLL$sp1[0]\n";
	push(@names,$spl[0]);
}
=cut
#print "DE __ NU :: @DE_NU\n";
$jode_nu = join("",@DE_NU);
#print "DE_NU :: $jode_nu\n";
#print "ENTIRE : DE _DE :$entire\n";
#@spde_nu = split(/
@spde_nu = split(/LLL/,$jode_nu);
	
foreach $kk (keys %full)
{
#       print "$kk ==== $full{$kk}\n";
        print "****$kk\n";
	#print "$jode_nu\n";
	@spde_nu = split(/LLL/,$jode_nu);
	for($w=0;$w<=$#spde_nu;$w++)
	{
        	@cal = split (/\[\[\[/,$full{$kk});
	}
        foreach(@cal)
        {
     		if ($_ =~ /^>/)
       		{
		#	print "SSSSS $_ \n";			
			$key = $_;
#			$hash{$key} = ();	
	        }
        	elsif($_ =~ /^ PAR/ || $_ =~ /^Z-SCORE/)
	        {
		#	print "LLLLLLL :: $_\n";
			if($_ =~ /^ PAR/)
			{
		                $hash{$key} .=$_;
		                $hash{$key} .="+++";
			}
			else
			{
				$hash{$key} .=$_;
				$hash{$key} .="*";
			}
	        }
        }
foreach(@spcalcal)
{
#	print "$_\n";
	foreach $key (keys %hash)
	{
		#print "iLLLLLLLL$key ::::: $hash{$key}\n";
		#print "iLLLLLLLL ::::: $hash{$key}\n";
		#print "KKKKKKK $key\n";
		@spkee = split (/\||>/,$key);
		#print "$spkee[1] ------- $spkee[6]\n";
		$nu_de = $spkee[1];
		push(@fac,$spkee[6].'*');
		push(@names,$spkee[6]);  
		@sp=split(/\+\+\+|\*/,$hash{$key});
	       #print "KKK@sp\n";
		@spnu_de = split(/\*/,$jonu_de);
	@split_fin = split(/=/,$_);
	foreach(@spde_nu)
	{
		@spppde_nu= split(/-/,$_);
		foreach(@spppde_nu)
		{
#	print"DDDDDDDDDDDDDDDDDDDDDDD $spppde_nu[0]\n";
			if($spppde_nu[0] eq $kk)
			{
			@spkee1 = split (/\||>/,$key);
			#print "iiiiiiiiiiiiiiiiiii$spkee1[6] eq$split_fin[0] ++$split_fin[1]\n";	
				if($split_fin[0] =~ /$spkee1[6]/)
				{
				print "$key\n";
#				print "iiiiiiiiiiiiiiiiiii$spkee1[6] eq$split_fin[0] ++ $split_fin[1]\n";
					foreach(@sp)
	        			{
					if($_ !~ /^ PAR/)
					{
						print "$_\n";
					}
					if($_ !~ /^Z-SCORE/)
					{
					#print "VVVVVVV ::$_  ENTIRE :: $entire :: NU_DE :: $split_fin[1] DE_NU :: $spppde_nu[1]\n";
					$nu_nu = substr($_,6,);
					#print "NUNU$nu_nu\n";
					#print "(($nu_nu/$split_fin[1])/($spppde_nu[1]/$entire))\n";
					$normali = (($nu_nu/$split_fin[1])/($spppde_nu[1]/$entire));
					$normal = sprintf "%.3f",$normali;
					print "NORMALISATION ::$normal/$entire\n";
					}
				}
				}
		@spppde_nu = ();
			}
		}
	}
	}
}
	print "________________\n";
undef (%hash);
}
