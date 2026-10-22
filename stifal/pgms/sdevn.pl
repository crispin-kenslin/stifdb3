#!/usr/bin/perl

open SD,"$ARGV[0]"||die "Type 'perl sdevn.pl x.out'\n";
@sd=<SD>;
close @sd;

sub deviation
{
	my ($a,@diss)=@_;
	$sum1=0;
	for(my $i=0;$i<=$#diss;$i++)
	{
        	$sum1+= $diss[$i];
	}
        $mean=$sum1/$a;
	$x_m=0;
	foreach (@diss)
	{
        	$x_m+=($_ - $mean) ** 2;
	}
	$res = sqrt ($x_m/($a-1));
	printf "%.2f", $res;
	print "\n";
}

undef %hash;
foreach (@sd)
{
	chomp $_;
	if ($_ =~ /^\*\*\*\*\w+/ || $_ =~ /^LEN/ || $_ =~ /^>\S+/ || $_ =~ /^\*\*\*\*/)
	{
		if($_ =~ /^\*\*\*\*\w+/)
		{
			print "$_\n";
		}
		if ($_ =~ />(\S+)/)
		{
#			print " IMP::$_\n";
			$subst=substr($_,30,);
#			print "KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK$subst\n";
			$key=$_;
		}
#		$hash{$key}=0;
	}	
	else
	{
		chomp $_;
		@sp = split(/\s+|\t/,$_);
		if($sp[3] != 0)
		{	
		#	print "ELE :: $sp[3]\n";
			$hash{$key}.= $sp[3];
			$hash{$key}.= " ";
		}
	}
}

foreach $key (keys %hash)
{
	if($hash{$key} != 0)
	{
#		print "$key :::::::::::::: $hash{$key}\n";
		print "$key\n";
		@arr=split(/ /,$hash{$key});
		$a =$#arr;
		&deviation($a,@arr);
		print "MEAN :: $mean\t\tSD :: $res\n";
	}
}
